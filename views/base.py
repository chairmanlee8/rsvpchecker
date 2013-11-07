import functools
import tornado.web, tornado.auth

from configuration import currentConfig, configDict
from tornado.web import HTTPError
from tornado.options import define, options
from tornado.escape import json_encode, json_decode
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
from sqlalchemy.ext.hybrid import Comparator

from models import Backend, User

class BaseHandler(tornado.web.RequestHandler):
    @property
    def db(self):
        return Backend.instance()
    
    @property
    def mail_connection(self):
        return self.application.mail_connection

    def get_current_user(self):
        user_cookie = self.get_secure_cookie("user")

        if user_cookie is None:
            return None
        else:
            try:
                session = self.db.get_session()
                result = session.query(User).filter(User.id == int(user_cookie)).one()
                return result
            except (NoResultFound, MultipleResultsFound):
                return None
            except SQLAlchemyError:
                return None

class BlankHandler(BaseHandler):
    def get(self):
        self.finish()

    def post(self):
        self.finish()

def admin_only(method):
    """ Decorate methods with this to require that the user be an admin. """
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        if not self.current_user.is_admin:
            raise HTTPError(403)
        return method(self, *args, **kwargs)

    return wrapper
