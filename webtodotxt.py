from flask import Flask, render_template, jsonify, request, g, make_response
from flask_httpauth import HTTPBasicAuth
from flask_babel import Babel, get_locale, _
from werkzeug.exceptions import HTTPException
import storage_backends
import todotxtio
import logging
import sys


# -----------------------------------------------------------
# Boot


app = Flask(__name__, static_url_path='')
app.config.from_pyfile('config.py')

app.config['LANGUAGES'] = {
    'en': 'English',
    'fr': 'Français',
    'pt': 'Portuguese'
}

babel = Babel(app)
auth = HTTPBasicAuth()

# Default Python logger
logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%d/%m/%Y %H:%M:%S',
    stream=sys.stdout
)

logging.getLogger().setLevel(logging.INFO)

# Default Flask loggers
for handler in app.logger.handlers:
    handler.setFormatter(logging.Formatter(fmt='%(asctime)s - %(levelname)s - %(message)s', datefmt='%d/%m/%Y %H:%M:%S'))


# -----------------------------------------------------------
# Routes


@app.route('/')
@auth.login_required
def home():
    locale = get_locale()

    return render_template('app.html', first_week_day=locale.first_week_day + 1)


@app.route('/todo.txt', methods=['GET', 'POST'])
@auth.login_required
def todotxt():
    status = 200

    try:
        storage_backend = get_current_storage_backend_instance()

        if request.method == 'GET':
            todos = storage_backend.retrieve()

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

            if criteria: # There are criteria provided, filter the todos list
                todos = todotxtio.search(todos, **criteria)

            result = {'status': 'success', 'data': todotxtio.to_dicts(todos)}
        elif request.method == 'POST':
            todos = todotxtio.from_dicts(request.get_json())

            storage_backend.store(todos)

            result = {'status': 'success', 'data': []}
    except Exception as e:
        result = {'status': 'failure', 'data': {'message': _('Error while loading or updating the Todo.txt file: %(exception)s', exception=str(e))}}
        status = 500

    return jsonify(result), status


# -----------------------------------------------------------
# Hooks


@app.before_request
def set_locale():
    if not hasattr(g, 'CURRENT_LOCALE'):
        if app.config['FORCE_LANGUAGE']:
            g.CURRENT_LOCALE = app.config['FORCE_LANGUAGE']
        else:
            g.CURRENT_LOCALE = request.accept_languages.best_match(app.config['LANGUAGES'].keys(), default=app.config['DEFAULT_LANGUAGE'])


@auth.get_password
def get_password(username):
    if username in app.config['USERS']:
        return app.config['USERS'].get(username)

    return None


@auth.error_handler
def auth_error():
    return http_error_handler(403, without_code=True)


@babel.localeselector
def get_app_locale():
    if not hasattr(g, 'CURRENT_LOCALE'):
        return app.config['DEFAULT_LANGUAGE']
    else:
        return g.CURRENT_LOCALE


# -----------------------------------------------------------
# HTTP errors handler


@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(500)
@app.errorhandler(503)
def http_error_handler(error, without_code=False):
    if isinstance(error, HTTPException):
        error = error.code
    elif not isinstance(error, int):
        error = 500

    body = render_template('errors/{}.html'.format(error))

    if not without_code:
        return make_response(body, error)
    else:
        return make_response(body)


# -----------------------------------------------------------
# Helpers


def get_current_storage_backend_instance():
    name = app.config['STORAGE_BACKEND_TO_USE']

    if name not in storage_backends.__all__:
        raise ValueError('{} isn\'t a valid storage backend name'.format(name))

    config = {}

    if name in app.config['STORAGE_BACKENDS']:
        config = app.config['STORAGE_BACKENDS'][name]

    return getattr(storage_backends, name)(config)
