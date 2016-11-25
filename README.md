# Web Todo.txt

A web-based GUI to manage a [Todo.txt](http://todotxt.com/) file.

## Prerequisites

  - Should work on any Python 3.x version. Feel free to test with another Python version and give me feedback
  - A [uWSGI](https://uwsgi-docs.readthedocs.io/en/latest/)-capable web server (optional, but recommended)

## Installation

Clone this repo, and then the usual `pip install -r requirements.txt`.

## Configuration

Copy the `config.example.py` file to `config.py` and fill in the configuration parameters.

Available configuration parameters are:

  - `SECRET_KEY` Set this to a complex random value
  - `DEBUG` Enable/disable debug mode
  - `LOGGER_HANDLER_POLICY` Policy of the default logging handler

More informations on the three above can be found [here](http://flask.pocoo.org/docs/0.11/config/#builtin-configuration-values).

  - `USER` The credentials required to access the app
  - `TODOTXT_LOCATION` Absolute path to a Todo.txt file

I'll let you search yourself about how to configure a web server along uWSGI.

## Usage

  - Standalone

Run the internal web server, which will be accessible at http://localhost:8080:

```
python local.py
```

  - uWSGI

The uWSGI file you'll have to set in your uWSGI configuration is `uwsgi.py`. The callable is `app`.

## How it works

This project is built on [Vue.js](http://vuejs.org/) 2 for the frontend and [Flask](http://flask.pocoo.org/) (Python) for
the backend. The [todotxtio](https://github.com/EpocDotFr/todotxtio) PyPI package is used to parse/write the Todo.txt file,
giving/receiving data through [Ajax](https://en.wikipedia.org/wiki/Ajax_(programming)).

## End words

If you have questions or problems, you can [submit an issue](https://github.com/EpocDotFr/webtodotxt/issues).

You can also submit pull requests. It's open-source man!