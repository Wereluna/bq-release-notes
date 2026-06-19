import time
import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Simple in-memory cache
CACHE = {
    'data': None,
    'expiry': 0
}
CACHE_DURATION = 300  # 5 minutes

def fetch_and_parse_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    
    # Parse XML feed
    root = ET.fromstring(response.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    updates = []
    
    for entry in root.findall('atom:entry', ns):
        entry_title = entry.find('atom:title', ns)
        entry_title_text = entry_title.text if entry_title is not None else "Unknown Date"
        
        entry_updated = entry.find('atom:updated', ns)
        entry_updated_text = entry_updated.text if entry_updated is not None else ""
        
        entry_id = entry.find('atom:id', ns)
        entry_id_text = entry_id.text if entry_id is not None else str(time.time())
        
        link_elem = entry.find("atom:link[@rel='alternate']", ns)
        if link_elem is None:
            link_elem = entry.find("atom:link", ns)
        link = link_elem.get('href') if link_elem is not None else ""
        
        content_elem = entry.find('atom:content', ns)
        if content_elem is None or content_elem.text is None:
            continue
            
        html_content = content_elem.text
        soup = BeautifulSoup(html_content, 'html.parser')
        
        headings = soup.find_all(['h3', 'h4'])
        if not headings:
            # If no headings, treat whole content as one update
            text_content = soup.get_text().strip()
            updates.append({
                'id': entry_id_text,
                'date': entry_title_text,
                'updated_raw': entry_updated_text,
                'type': 'Update',
                'html': str(soup),
                'text': text_content,
                'link': link
            })
        else:
            for i, heading in enumerate(headings):
                update_type = heading.get_text().strip()
                # Gather siblings until next heading
                sibling_html = []
                sibling_text = []
                curr = heading.next_sibling
                while curr and curr.name not in ['h3', 'h4']:
                    if curr.name:
                        sibling_html.append(str(curr))
                        sibling_text.append(curr.get_text().strip())
                    elif isinstance(curr, str) and curr.strip():
                        sibling_html.append(curr)
                        sibling_text.append(curr.strip())
                    curr = curr.next_sibling
                
                html_str = "".join(sibling_html).strip()
                text_str = " ".join(sibling_text).strip()
                text_str = " ".join(text_str.split()) # normalize spacing
                
                sub_id = f"{entry_id_text}#update_{i}"
                
                updates.append({
                    'id': sub_id,
                    'date': entry_title_text,
                    'updated_raw': entry_updated_text,
                    'type': update_type,
                    'html': html_str,
                    'text': text_str,
                    'link': link
                })
                
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes_api():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    if not force_refresh and CACHE['data'] is not None and now < CACHE['expiry']:
        return jsonify({
            'source': 'cache',
            'notes': CACHE['data']
        })
        
    try:
        notes = fetch_and_parse_notes()
        CACHE['data'] = notes
        CACHE['expiry'] = now + CACHE_DURATION
        return jsonify({
            'source': 'network',
            'notes': notes
        })
    except Exception as e:
        # Failover to cache if network call fails
        if CACHE['data'] is not None:
            return jsonify({
                'source': 'cache-failover',
                'notes': CACHE['data'],
                'error': str(e)
            })
        return jsonify({
            'error': f'Failed to retrieve release notes: {str(e)}'
        }), 500
if __name__ == " __main__":
    app.run(host="127.0.0.1",port=5000,debug=True)
    

