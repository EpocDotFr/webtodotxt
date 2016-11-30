from flask import Flask, render_template, jsonify, request, g
from flask_httpauth import HTTPBasicAuth
from flask_babel import Babel, _
import logging
import sys
import todotxtio

app = Flask(__name__, static_url_path='')
app.config.from_pyfile('config.py')
app.config['LANGUAGES'] = {
    'en': 'English',
    'fr': 'Français'
}

babel = Babel(app)

auth = HTTPBasicAuth()

logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%d/%m/%Y %H:%M:%S',
    stream=sys.stdout
)

logging.getLogger().setLevel(logging.INFO)

# -----------------------------------------------------------


@auth.login_required
@app.route('/')
def home():
    return render_template('app.html')


@auth.login_required
@app.route('/todo.txt', methods=['GET', 'POST'])
def todotxt():
    status = 200

    if request.is_xhr:
        try:
            if request.method == 'GET':
                todos = todotxtio.from_file(app.config['TODOTXT_LOCATION'])

                result = {'status': 'success', 'data': todotxtio.to_dicts(todos)}
            elif request.method == 'POST':
                todos = todotxtio.from_dicts(request.get_json())

                todotxtio.to_file(app.config['TODOTXT_LOCATION'], todos)

                result = {'status': 'success', 'data': []}
        except Exception as e:
            result = {'status': 'failure', 'data': {'message': _('Error while loading or updating the Todo.txt file: %(exception)s', exception=str(e))}}
            status = 500
    else:
        result = {'status': 'failure', 'data': {'message': _('Invalid request.')}}
        status = 400

    return jsonify(result), status

# -----------------------------------------------------------


@app.before_request
def set_locale():
    if not hasattr(g, 'current_locale'):
        if app.config['FORCE_LANGUAGE']:
            g.CURRENT_LOCALE = app.config['FORCE_LANGUAGE']
        else:
            g.CURRENT_LOCALE = request.accept_languages.best_match(app.config['LANGUAGES'].keys())


@auth.get_password
def get_password(username):
    if username in app.config['USER']:
        return app.config['USER'].get(username)

    return None


@babel.localeselector
def get_locale():
    return g.CURRENT_LOCALE
