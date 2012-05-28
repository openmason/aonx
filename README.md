# aonx
Highly opinionated server framework based on node.js, express, mongoose

# Following are the standard response codes
  * http://www.iana.org/assignments/http-status-codes/http-status-codes.xml
  * 2xx - success
    * 201 - created
    * 202 - accepted
    * 204 - no content
  * 4xx - request failure
    * 400 - bad request
    * 401 - unauthorized (authentication)
    * 403 - forbidden (authorization)
    * 404 - not found
    * 405 - method not allowed
    * 406 - not acceptable
    * 409 - conflict 
    * 416 - invalid range
  * 5xx - internal server failure
    * 500 - internal server error / op timed out
    * 503 - server busy

# Features
 * API server

**ALPHA product, use at your risk, please refer to examples and todo-server**

## Todo
 * connect 2.x has compress, once available remove gzippo
