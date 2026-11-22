#!/usr/bin/env python3
"""Static file server for Pet Salon + live ICY Now-Playing metadata endpoint."""
import http.server
import json
import re
import socketserver
import ssl
import urllib.parse
import urllib.request

PORT = 8095

STATION_STREAMS = {
    'kpop': 'https://kathy.torontocast.com:3060/stream',
    'lofi': 'https://streams.fluxfm.de/Chillhop/mp3-128/',
    'spa': 'https://0n-relax.radionetz.de/0n-relax.mp3',
    'jazz': 'https://stream.srg-ssr.ch/m/rsj/mp3_128',
    'classic': 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
}


def read_icy_title(url: str) -> str:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'PetSalonRadio/1.0',
            'Icy-MetaData': '1',
        },
    )
    with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
        metaint = resp.headers.get('icy-metaint')
        if not metaint:
            return ''
        interval = int(metaint)
        resp.read(interval)
        length_byte = resp.read(1)
        if not length_byte:
            return ''
        meta_len = length_byte[0] * 16
        if meta_len <= 0:
            return ''
        meta_raw = resp.read(meta_len).decode('utf-8', errors='replace')
        m = re.search(r"StreamTitle='([^']*)'", meta_raw)
        return m.group(1).strip() if m else ''


def parse_artist_track(stream_title: str) -> dict:
    title = (stream_title or '').strip()
    if not title:
        return {'artist': '', 'track': '', 'raw': ''}
    for sep in (' - ', ' – ', ' — '):
        if sep in title:
            artist, track = title.split(sep, 1)
            return {'artist': artist.strip(), 'track': track.strip(), 'raw': title}
    return {'artist': title, 'track': '', 'raw': title}


class SalonHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/nowplaying':
            qs = urllib.parse.parse_qs(parsed.query)
            st_id = (qs.get('station') or [''])[0]
            stream_url = STATION_STREAMS.get(st_id)
            payload = {'station': st_id, 'artist': '', 'track': '', 'raw': ''}
            if stream_url:
                try:
                    raw = read_icy_title(stream_url)
                    payload.update(parse_artist_track(raw))
                except Exception:
                    pass
            body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, format, *args):
        return


class ReusableTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    with ReusableTCPServer(('0.0.0.0', PORT), SalonHandler) as httpd:
        print(f'Pet Salon server running on http://localhost:{PORT}/', flush=True)
        httpd.serve_forever()
