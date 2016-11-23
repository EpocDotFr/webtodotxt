from flask import Flask, render_template, json, request
from flask_httpauth import HTTPBasicAuth
import logging
import sys

app = Flask(__name__, static_url_path='')
app.config.from_pyfile('config.py')

auth = HTTPBasicAuth()

logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%d/%m/%Y %H:%M:%S',
    stream=sys.stdout
)

logging.getLogger().setLevel(logging.INFO)


@app.route('/')
@auth.login_required
def home():
    return render_template('app.html')


@app.route('/todo.txt', methods=['GET', 'POST'])
def todotxt():
    if request.method == 'GET':
        result = {'status': 'success', 'data': []}
    elif request.method == 'POST':
        result = {'status': 'success', 'data': []}

    return json.dumps(result)


@auth.get_password
def get_password(username):
    if username in app.config['USER']:
        return app.config['USER'].get(username)

    return None
