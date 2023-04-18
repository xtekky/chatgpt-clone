from server.app import app
from flask      import Response

@app.errorhandler(404)
def page_not_found(e):
    return Response('404: not found', 404)

@app.errorhandler(403)
def method_not_allowed(e):
    print(e)
    return Response('403: forbidden', 403)

@app.errorhandler(429)
def method_not_allowed(e):
    print(e)
    return Response('429: ratelimit', 429)

@app.errorhandler(400)
def bad_request(e):
    return Response('400: bad request', 400)

@app.errorhandler(401)
def unauthorized(e):
    return Response('401: unauthorized', 401)

@app.errorhandler(418)
def im_a_teapot(e):
    return Response("418: I'm a teapot", 418)

@app.errorhandler(414)
def uri_too_long(e):
    return Response('414: uri too long', 414)

@app.errorhandler(406)
def not_acceptable(e):
    return Response('406: not acceptable', 406)

@app.errorhandler(408)
def request_timeout(e):
    return Response('408: request timeout', 408)

@app.errorhandler(413)
def payload_too_large(e):
    return Response('413: payload too large', 413)

@app.errorhandler(405)
def method_not_allowed(e):
    return Response('405: method not allowed', 405)

@app.errorhandler(503)
def service_unavailable(e):
    return Response('503: service unavailable', 503)

@app.errorhandler(422)
def unprocessable_entity(e):
    return Response('422: unprocessable entity', 422)

@app.errorhandler(500)
def internal_server_error(e):
    return Response('500: internal server error', 500)

@app.errorhandler(415)
def unsupported_media_type(e):
    return Response('415: unsupported media type', 415)

@app.errorhandler(411)
def length_required(e):
    return Response('411: length required', 411)

@app.errorhandler(412)
def precondition_failed(e):
    return Response('412: precondition failed', 412)

@app.errorhandler(410)
def gone(e):
    return Response('410: gone', 410)

@app.errorhandler(409)
def conflict(e):
    return Response('409: conflict', 409)