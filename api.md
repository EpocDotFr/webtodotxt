# Web Todo.txt "API" documentation

Web Todo.txt provide some sort of "API" (read: a single endpoint both used for reading/writing the Todo.txt file also used by Web Todo.txt itself) so you'll be able to integrate it in other system.

URL to this endpoint is `/todo.txt`.

## Authentication

You'll need to be authenticated to use this endpoint. Simply use a [HTTP basic auth](https://en.wikipedia.org/wiki/Basic_access_authentication) header. Provide the same credentials as the ones in your `USERS` configuration parameter.

Again, **it is highly recommended to serve Web Todo.txt through HTTPS** because HTTP basic auth isn't secure on unencrypted HTTP.

## Data format

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
         "tags": {
            "due": "2017-01-29"
         },
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

## Possible HTTP status codes

  - 200: Everything is OK
  - 404: The Todo.txt file wasn't found
  - 500: Server error (see the `message` attribute in the JSON body for more information)

## Getting the Todo.txt content: `GET /todo.txt`

If successful, you'll find an array of todo objects in the `data` attribute in the JSON body.

### Filtering results

You can filter the resulting todos by using one or many of the following query string parameters:

  - `text` (`string`) Text part of the todo
  - `completed` (`int`: `1` or `0`) Whether the todo is respectively completed or not
  - `completion_date` (`string`: `YYYY-MM-DD`) Todo completion date
  - `priority` (`array`) List of priorities. Each of them are one letter from A to Z (i.e `priority=A&priority=C`)
  - `creation_date` (`string`: `YYYY-MM-DD`) Todo creation date
  - `projects` (`array`) List of projects name (i.e `projects=hey&projects=one`)
  - `contexts` (`array`) List of contexts name (i.e `contexts=woah&contexts=two`)
  - `tags` (`array`) List of tags. Tags key/value are separated by a colon (i.e `tags=key:value&tags=due:2016-12-01`)

## Updating the Todo.txt content: `POST /todo.txt`

Simply post the exact same format as the `data` attribute you get when GETing the Todo.txt file.

**Caution:** partial update isn't supported (you'll always need to POST all the todos along the ones you modified/created).

This endpoint do not return any content in `data`.