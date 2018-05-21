# Web Todo.txt

A web-based GUI to manage a [Todo.txt](http://todotxt.com/) file.

<p align="center">
  <img src="https://github.com/EpocDotFr/webtodotxt/raw/master/screenshot.png">
</p>

## Features

  - Add / edit / remove tasks
  - Tasks due date (WIP)
  - Filters on all possible task data
  - Projects and contexts are cached locally for future use (using [localStorage](https://en.wikipedia.org/wiki/Web_storage#localStorage)) (WIP)
  - Automatic sorting
  - Save and reload the task list
  - Clear displaying of the task priority and completion
  - Automatic task creation date and completion date setting
  - Links are automatically created for URLs and email addresses
  - Possible to integrate with other system using a very basic "API" (I put API in quotes because it isn't really an API). See below for more information
  - Warns before quitting if your task list wasn't saved to prevent data loss
  - Support 2 storage backends (see below in the **Supported storage backends** section for the list)
  - Internationalized & localized in 3 languages:
    - English (`en`)
    - French (`fr`)
    - Portuguese (WIP) (`pt`)
    - German (`de`)
  - Multi authentication backend support

## Prerequisites

  - Should work on any Python 3.x version. Feel free to test with another Python version and give me feedback
  - A [uWSGI](https://uwsgi-docs.readthedocs.io/en/latest/)-capable web server (optional, but recommended)
  - A modern web browser (which optionally support localStorage)

## Installation

  1. Clone this repo somewhere
  2. `pip install -r requirements.txt`
  3. `pybabel compile -d translations`
  4. **IMPORTANT:** Other dependencies are needed regarding the storage backend you'll use. Please refer to the table in the **Supported storage backends** section below and install them accordingly using `pip install <package>` before continuing

## Configuration

Copy the `config.example.py` file to `config.py` and fill in the configuration parameters.

Available configuration parameters are:

  - `SECRET_KEY` Set this to a complex random value

More informations about Flask config values can be found [here](http://flask.pocoo.org/docs/1.0/config/#builtin-configuration-values).

  - `TITLE` If set to a string, will be used to replace the default app title (which is "Web Todo.txt")
  - `USERS` The credentials required to access the app. You can specify multiple ones. **It is highly recommended to serve Web Todo.txt through HTTPS** because it uses [HTTP basic auth](https://en.wikipedia.org/wiki/Basic_access_authentication)
  - `FORCE_LANGUAGE` Force the lang to be one of the supported ones (defaults to `None`: auto-detection from the `Accept-Language` HTTP header). See in the features section above for a list of available lang keys
  - `DEFAULT_LANGUAGE` Default language if it cannot be determined automatically. Not taken into account if `FORCE_LANGUAGE` is defined. See in the features section above for a list of available lang keys
  - `DISPLAY_CREATION_DATE` Whether the creation date of the tasks must be displayed or not
  - `STORAGE_BACKEND_TO_USE` The storage backend to use. Can be one of the ones in the table below, in the **Supported storage backends** section
  - `STORAGE_BACKENDS` Self-explanatory storage backends-specific configuration values. Don't forget to change them before using your desired storage backend
  - `AUTH_BACKEND_TO_USE` Let you select one of the available auth backends. See **Supported auth backends** section.

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

  - Docker

Build the image in the applications root dir:

```
docker build -t <image_name> .
```

The image can be configured via environment variables. The available variables are:

| Variable | Default |Description |
|----------|---------|------------|
| SECRET_KEY | `this-is-not-a-secret-key!` | The secret key of the app. **PLEASE CHANGE THIS!** |
| USER_DICT | `{}` | The set of predefined users as python-sict (e.g. {"john": "secret_pass"} |
| AUTH_BACKEND | `DictAuth` | The authentication backend to use. |
| STORAGE_BACKEND | `FileSystem` | The storage backend to use. |
| TODO_FILE_PATH | Backend-dependend | The path to the todo.txt in all backends |
| DROPBOX_ACCESS_TOKEN | None | The accesstoken that is used if storage backend is dropbox |
| WEBDAV_HOST | `https://my.webdav.com` | The hostname of the webdav server if WebDav storage is used. |
| MODE | `http` | The mode the uwsgi should operate in. If set to `http` it can be used as a normal webserver. The other option is `socket` which enables the uwsgi protocol. |

Please mention [@janLO](https://github.com/janLo/) in issues with the docker support.

  - Others

You'll probably have to hack with this application to make it work with one of the solutions described [here](http://flask.pocoo.org/docs/0.12/deploying/). Send me a pull request if you make it work.

## How it works

This project is built on [Vue.js](http://vuejs.org/) 2 for the frontend and [Flask](http://flask.pocoo.org/) (Python) for
the backend. The [todotxtio](https://github.com/EpocDotFr/todotxtio) PyPI package is used to parse/write the Todo.txt file,
giving/receiving data through [Ajax](https://en.wikipedia.org/wiki/Ajax_(programming)). Several storage backends
are available so one can choose to save its Todo.txt file locally on the filesystem, on its Dropbox or in a WebDav instance
like Nextcloud.

## "API"

Please navigate [here](https://github.com/EpocDotFr/webtodotxt/blob/master/api.md) for the full docs.

## Gotchas

  - Be aware that this web application isn't intended to be used on mobile devices

Instead, use native mobile apps to edit and sync the Todo.txt file:

**On Android**, you can use [Simpletask](https://play.google.com/store/apps/details?id=nl.mpcjanssen.todotxtholo&hl=en)
(free) which can natively sync your tasks with your Dropbox and Nextcloud. If you're using another storage provider (third-party or
self-hosted), you can use a modified version of this app called [Simpletask Cloudless](https://play.google.com/store/apps/details?id=nl.mpcjanssen.simpletask&hl=en)
(also free, from the same author) which comes with no sync at all, but instead saves all your tasks in a file on your
device. You can then do whatever you want with this file like syncing it via SFTP or many other providers / protocols
with [FolderSync](https://play.google.com/store/apps/details?id=dk.tacit.android.foldersync.lite&hl=en) (free, but a
[pro version](https://play.google.com/store/apps/details?id=dk.tacit.android.foldersync.full&hl=en) is available).

**On iOS**, I don't know. Feel free to share your finds.

  - This web application wasn't designed to be multi-process compliant

If you sync your Todo.txt file via Dropbox or something from the mobile apps and at the same time you're modifiying it via
this web app, you'll probably end with a loss of data because both sides can't be aware of the latest version of the file
in realtime: they both erase the file with their data.

So make sure you're modifying it from one location at a time with the latest up-to-date Todo.txt file.

## Supported auth backends

| Name | Configuration value | Additional PyPI dependencies |
|------|---------------------|------------------------------|
| Predefined users | `DictAuth` |  |
| WebDAV auth | `WebDavAuth` | `webdavclient3` |

The `DictAuth` uses the `USERS` dict from the config as user database. With this nothing fancy happens
at all. The `WebDavAuth` has no local user database. It forwards the login data from the user to the
configured webdav server and tries to log in on his behalf. If this is successful, access will be granted.

## Supported storage backends

| Name | Configuration value | Additional PyPI dependencies |
|------|---------------------|------------------------------|
| Local file system | `FileSystem` |  |
| [Dropbox](https://www.dropbox.com/) | `Dropbox` | `dropbox` |
| [WebDAV](https://en.wikipedia.org/wiki/WebDAV#Server_support) | `WebDav` | `webdavclient3` |

## Multi user support

The `WebDav` storage backend has two special features:
* The path of the todo.txt file can contain a placeholder for the user in the form `{username}` which will
  be replaced by the current user name. With this its possible to have multiple todo files for multiple
  users.
* The actual credentials of the user will be either taken from the backends config values `webdav_login`
  and `webdav_password` or, if omitted, from the current user.

With these features there are several multi-user-scenarios possible:
* You can have predefined users in the `USERS` dict that share one and the same todo file (no user
  placeholder, dav credentials given in the storage config and `DictAuth`).
* You can have predefined users in the `USERS` dict which each has its own todo.txt file on the same
  storage (filename with user placeholder, dav credentials given in the storage config and `DictAuth`)
* You can have all the above using your webdav server as an auth backend by using the `WebDavAuth`.
* You can have each webdav user have its own file on its own storage by using the placeholder and
  omitting the dav credentials from the storage config.

## Nextcloud Usage

To use a nextcloud storage you have to specify the whole file path (from the host part on) as path.
If your server is named `my.nextcloud.home` then the storage config should look like this:
```python
    'WebDav': {
        'path': 'remote.php/dav/files/<username>/todo.txt',
        'webdav_hostname': 'https://my.nextcloud.home',
        'webdav_login': '<username>',
        'webdav_password': '<PASSWORD>'
    }
```

Username and password are your regular nextcloud credentials. I highly recommend to not store
them in the config. Instead use the `WebDavAuth` method:
```python
AUTH_BACKEND_TO_USE = 'WebDavAuth'
[...]
    'WebDav': {
        'path': 'remote.php/dav/files/<username>/todo.txt',
        'webdav_hostname': 'https://my.nextcloud.home',
    }
```

If you want no user specific configuration in your config you can use the placeholder method:
```python
AUTH_BACKEND_TO_USE = 'WebDavAuth'
[...]
    'WebDav': {
        'path': 'remote.php/dav/files/{username}/todo.txt',
        'webdav_hostname': 'https://my.nextcloud.home',
    }
```

## Contributors

Thanks to:

  - [@Pepsit36](https://github.com/Pepsit36) (Portuguese translations)
  - [@janLo](https://github.com/janLo) (WebDav auth & storage support, Dockerfile)
  - [@Strubbl](https://github.com/Strubbl) (German translation)

## End words

If you have questions or problems, you can [submit an issue](https://github.com/EpocDotFr/webtodotxt/issues).

You can also submit pull requests. It's open-source man!
