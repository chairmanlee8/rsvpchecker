import os, os.path, subprocess, pickle
import tornado.httpserver, tornado.ioloop, tornado.web, tornado.auth
import smtplib
import zlib
import logging
from functools import partial

from datetime import datetime, timedelta

from configuration import currentConfig, configDict, setConfig
from tornado.options import define, options
from tornado.escape import json_encode, json_decode
from tornado.ioloop import PeriodicCallback
import tornado.template as template
import tornado.autoreload

from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
from sqlalchemy.sql.expression import asc, desc, or_

from views.gui import *

from models import *

class Application(tornado.web.Application):
    def __init__(self, host, port):
        # Will need login_url for settings
        settings = dict(
            fb_api_key = currentConfig.fb_api_key,
            fb_secret = currentConfig.fb_secret,
            template_path = os.path.join(os.path.dirname(__file__), "templates"),
            static_path = os.path.join(os.path.dirname(__file__), "static"),
            cookie_secret = currentConfig.cookie_secret,
            site_url = currentConfig.site_url,
            login_url = currentConfig.login_url,
            debug = currentConfig.debug,
        )

        handlers = [
            # Authentication
            #(r"/fblogin", UserFacebookLoginHandler),                    # Facebook login as from before
            #(r"/logout", UserLogoutHandler),                            # Universal logout

            # Page handlers
            (r"/", ViewIndexHandler),                                   # gui.py
        ]

        tornado.web.Application.__init__(self, handlers, **settings)

def _ping_db():
    Backend.instance().get_session().execute("show variables")
                    
def main(host, port):
    tornado.options.parse_command_line()
    application = Application(host, port)
    global g_app
    g_app = application

    # Start MySQL ping
    # PeriodicCallback(_ping_db, 3600 * 1000 / 2).start()

    logging.info("Server listening on %d..." % port)

    application.listen(port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
