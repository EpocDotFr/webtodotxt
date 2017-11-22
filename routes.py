from flask import render_template, jsonify, request
from flask_babel import get_locale, _
from webtodotxt import app, auth
from helpers import *
import todotxtio


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
