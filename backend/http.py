from flask import request


class InvalidJsonRequestError(Exception):
    pass


def require_json_object():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise InvalidJsonRequestError('Request must be valid JSON')
    return data
