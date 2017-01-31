# Web Todo.txt

A web-based GUI to manage a [Todo.txt](http://todotxt.com/) file.

<p align="center">
  <img src="https://github.com/EpocDotFr/webtodotxt/raw/master/screenshot.png">
</p>

## Features

  - Add / edit / remove tasks
  - Tasks due date (WIP)
  - Filters on all possible task data
  - Projects and contexts are cached locally for future use (using [localStorage](https://en.wikipedia.org/wiki/Web_storage#localStorage))
  - Automatic sorting
  - Save and reload the task list
  - Clear displaying of the task priority and completion
  - Automatic task creation date and completion date setting
  - Basic Markdown support for inline formatting styles (strong, emphasis, code, deleted, link. Text links and emails are also auto-linked)
  - Automatic saving (WIP)
  - Possible to integrate with other system using a very basic "API" (I put API in quotes because it isn't really an API). See below for more information
  - Internationalized & localized in 3 languages:
    - English (`en`)
    - French (`fr`)
    - Portuguese (WIP) (`pt`)

## Prerequisites

  - Should work on any Python 3.x version. Feel free to test with another Python version and give me feedback
  - A [uWSGI](https://uwsgi-docs.readthedocs.io/en/latest/)-capable web server (optional, but recommended)

## Installation

  1. Clone this repo somewhere
  2. `pip install -r requirements.txt`
  3. `pybabel compile -d translations`

## Configuration

Copy the `config.example.py` file to `config.py` and fill in the configuration parameters.

Available configuration parameters are:

  - `SECRET_KEY` Set this to a complex random value
  - `DEBUG` Enable/disable debug mode
  - `LOGGER_HANDLER_POLICY` Policy of the default logging handler

More informations on the three above can be found [here](http://flask.pocoo.org/docs/0.11/config/#builtin-configuration-values).

  - `USERS` The credentials required to access the app. You can specify multiple ones. **It is highly recommended to serve Web Todo.txt through HTTPS** because it uses [HTTP basic auth](https://en.wikipedia.org/wiki/Basic_access_authentication)
  - `TODOTXT_LOCATION` Path to a Todo.txt file (may be relative or absolute)
  - `FORCE_LANGUAGE` Force the lang of the web app to be one of the supported ones (defaults to `None`: auto-detection from the `Accept-Language` HTTP header). See in the features section above for a list of available lang keys

I'll let you search yourself about how to configure a web server along uWSGI.

## Usage

  - Standalone

Run the internal web server, which will be accessible at `http://localhost:8080`:

```
python local.py
```

Edit this file and change the interface/port as needed.

  - uWSGI

The uWSGI file you'll have to set in your uWSGI configuration is `uwsgi.py`. The callable is `app`.

  - Others

You'll probably have to hack with this application to make it work with one of the solutions described [here](http://flask.pocoo.org/docs/0.11/deploying/). Send me a pull request if you make it work.

## How it works

This project is built on [Vue.js](http://vuejs.org/) 2 for the frontend and [Flask](http://flask.pocoo.org/) (Python) for
the backend. The [todotxtio](https://github.com/EpocDotFr/todotxtio) PyPI package is used to parse/write the Todo.txt file,
giving/receiving data through [Ajax](https://en.wikipedia.org/wiki/Ajax_(programming)).

## "API"

Web Todo.txt provide some sort of "API" (read: a single endpoint both used for reading/writing the Todo.txt file also used by Web Todo.txt itself) so you'll be able to integrate it in other system.

URL to this endpoint is `/todo.txt`.

### Authentication

You'll need to be authenticated to use this endpoint. Simply use a [HTTP basic auth](https://en.wikipedia.org/wiki/Basic_access_authentication) header. Provide the same credentials as the ones in your `USERS` configuration parameter.

Again, **it is highly recommended to serve Web Todo.txt through HTTPS** because HTTP basic auth isn't secure on unencrypted HTTP.

### Data format

Everything is [JSON](https://en.wikipedia.org/wiki/JSON).

**Example of response in case of success:**

```json
{
   "status": "success",
   "data": [
      {
         "completed": false,
         "completion_date": null,
         "contexts": [
            "ftw"
         ],
         "creation_date": null,
         "priority": "A",
         "projects": [
            "python",
            "awesomeproject"
         ],
         "tags": {},
         "text": "Todo.txt rocks"
      }
   ]
}
```

**Example of response in case of failure:**

```json
{
   "status": "failure",
   "data": {
      "message": "The error message"
   }
}
```

### Possible HTTP status codes

  - 200: Everything is OK
  - 404: The Todo.txt file wasn't found
  - 500: Server error (see the `message` attribute in the JSON body for more information)

### Getting the Todo.txt content: `GET /todo.txt`

If successful, you'll find an array of todo objects in the `data` attribute in the JSON body.

#### Filtering results

You can filter the resulting todos by using one or many of the following query string parameters:

  - `text` (`string`) Text part of the todo
  - `completed` (`int`: `1` or `0`) Whether the todo is respectively completed or not
  - `completion_date` (`string`: `YYYY-MM-DD`) Todo completion date
  - `priority` (`array`) List of priorities. Each of them are one letter from A to Z (i.e `priority=A&priority=C`)
  - `creation_date` (`string`: `YYYY-MM-DD`) Todo creation date
  - `projects` (`array`) List of projects name (i.e `projects=hey&projects=one`)
  - `contexts` (`array`) List of contexts name (i.e `contexts=woah&contexts=two`)
  - `tags` (`array`) List of tags. Tags key/value are separated by a colon (i.e `tags=key:value&tags=due:2016-12-01`)

### Updating the Todo.txt content: `POST /todo.txt`

Simply post the exact same format as the `data` attribute you get when GETing the Todo.txt file.

**Caution:** partial update isn't supported (you'll always need to POST all the todos along the ones you modified/created).

This endpoint do not return any content in `data`.

## Gotchas

  - Be aware that this web application isn't intended to be used on mobile devices

Instead, use native mobile apps to edit and sync the Todo.txt file:

**On Android**, [Simpletask Cloudless](https://play.google.com/store/apps/details?id=nl.mpcjanssen.simpletask) along [FolderSync Lite](https://play.google.com/store/apps/details?id=dk.tacit.android.foldersync.lite)

**On iOS**, I don't know. Feel free to share your finds.

  - This web application wasn't designed to be multi-process compliant

If you sync your Todo.txt file via SFTP or something from the mobile apps and at the same time you're modifiying it via
this web app, you'll probably end with a loss of data because both sides can't be aware of the latest version of the file
in realtime: they both erase the file with their data.

So make sure you're modifying it from one location at a time with the latest up-to-date Todo.txt file.

## Contributors

Thanks to:

  - [@Pepsit36](https://github.com/Pepsit36) (Portuguese translations)

## End words

If you have questions or problems, you can [submit an issue](https://github.com/EpocDotFr/webtodotxt/issues).

You can also submit pull requests. It's open-source man!