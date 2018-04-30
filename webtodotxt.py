from logging.handlers import RotatingFileHandler
from flask_httpauth import HTTPBasicAuth
from flask_babel import Babel
from flask import Flask
import logging


# -----------------------------------------------------------
# Boot


app = Flask(__name__, static_url_path='')
app.config.from_pyfile('config.py')

if not app.config['TITLE']:
    app.config['TITLE'] = 'Web Todo.txt'

app.config['LANGUAGES'] = {
    'en': 'English',
    'fr': 'Français',
    'pt': 'Portuguese'
}

babel = Babel(app)
auth = HTTPBasicAuth()

handler = RotatingFileHandler('storage/logs/errors.log', maxBytes=10000000, backupCount=2)
handler.setLevel(logging.WARNING)
formatter = logging.Formatter(fmt='%(asctime)s - %(levelname)s - %(message)s', datefmt='%d/%m/%Y %H:%M:%S')
handler.setFormatter(formatter)
app.logger.addHandler(handler)

from helpers import *


# -----------------------------------------------------------
# After-init imports


import routes
import hooks
