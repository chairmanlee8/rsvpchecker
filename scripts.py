import os, sys, subprocess, argparse
from configuration import setConfig, configDict, currentConfig

parser = argparse.ArgumentParser(description='Commands for RSVP Checker server.')
parser.add_argument('command', nargs='+')
parser.add_argument('--config', default="devpure", help="Config option to use " + "/".join(configDict.keys()))
parser.add_argument('--address', default="", help="run on the given address", type=str)
parser.add_argument('--port', default=8080, help="run on the given port", type=int)

# Note: scripts.py launch --config=... behaves differently from scripts.py --config=... launch

"""
    Commands:

    * mkdb -- create database according to the parameters specified by the configuration
    * build -- just run the build sequence (haml/sass etc.)
    * launch -- launch StudyCloud LMS according to configuration given
    * shell -- launch a Python REPL with a database session initialized
    * test -- run unit tests

    Commands are executed in argument order (left to right on command line).
"""

if __name__ == "__main__":
    args = parser.parse_args()
    setConfig(args.config)

    import logging
    logging.getLogger().setLevel(currentConfig.logging_mask)
    
    from models import *

    for cmd in args.command:
        if cmd == "mkdb":
            create_all()
        elif cmd == "launch":
            from app import main
            main(args.address, args.port)
        elif cmd == "shell":
            import code
            session = Backend.instance().get_session()
            code.interact(local=locals())
        elif cmd == "test":
            import unittest
            suite = unittest.TestLoader().discover('tests')
            unittest.TextTestRunner(verbosity=2).run(suite)
