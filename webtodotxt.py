from flask import Flask, render_template, jsonify, request, g
from flask_httpauth import HTTPBasicAuth
from flask_babel import Babel, get_locale, _
import logging
import sys
import todotxtio
import os

app = Flask(__name__, static_url_path='')
app.config.from_pyfile('config.py')
app.config['LANGUAGES'] = {
    'en': 'English',
    'fr': 'Français',
    'pt': 'Portuguese'
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


@app.route('/')
@auth.login_required
def home():
    locale = get_locale()

    return render_template('app.html', first_week_day=locale.first_week_day + 1)


@app.route('/todo.txt', methods=['GET', 'POST'])
@auth.login_required
def todotxt():
    status = 200

    todotxt_location = os.path.abspath(app.config['TODOTXT_LOCATION'])

    try:
        if request.method == 'GET':
            todos = todotxtio.from_file(todotxt_location)

            allowed_params = ['text', 'completed', 'completion_date', 'priority', 'creation_date', 'projects', 'contexts', 'tags']

            criteria = {}

            for allowed_param in allowed_params:
                if allowed_param in request.args:
                    if allowed_param == 'completed':
                        criteria[allowed_param] = bool(request.args.get(allowed_param, type=int))
                    elif allowed_param in ['priority', 'projects', 'contexts']:
                        criteria[allowed_param] = request.args.getlist(allowed_param, type=str)
                    elif allowed_param == 'tags':
                        criteria[allowed_param] = dict([(tag.split(':')[0], tag.split(':')[1]) for tag in request.args.getlist(allowed_param, type=str)])
                    else:
                        criteria[allowed_param] = request.args.get(allowed_param, type=str)

            print(criteria)

            if criteria: # There are criteria provided, filter the todos list
                todos = todotxtio.search(todos, **criteria)

            result = {'status': 'success', 'data': todotxtio.to_dicts(todos)}
        elif request.method == 'POST':
            todos = todotxtio.from_dicts(request.get_json())

            todotxtio.to_file(todotxt_location, todos)

            result = {'status': 'success', 'data': []}
    except FileNotFoundError:
        result = {'status': 'failure', 'data': {'message': _('The Todo.txt file can\'t be found at the specified location: %(location)s', location=todotxt_location)}}
        status = 404
    except Exception as e:
        result = {'status': 'failure', 'data': {'message': _('Error while loading or updating the Todo.txt file: %(exception)s', exception=str(e))}}
        status = 500

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
def get_app_locale():
    return g.CURRENT_LOCALE
