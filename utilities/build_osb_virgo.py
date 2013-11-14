from __future__ import with_statement
import os
#########################################
# Downloads a Virgo server and the OsbExplorer
# bundles and creates a zip file that contains
# a configured Virgo server
#
# To use:
# * Make sure Maven (http://maven.apache.org) is installed
# * Make sure Fabric is installed:
#   http://docs.fabfile.org/en/1.5/installation.html
#######################################


import urllib
import tempfile, shutil, zipfile, re, sys
from fabric.api import local, lcd, hide, settings
import os.path as op

import sys

branch="master"

if len(sys.argv) == 2:
    if sys.argv[1]=="development":
        branch="development"

   
virgo_version = "3.6.2.RELEASE"

urls = ["http://www.eclipse.org/downloads/download.php?file=/virgo/release/VP/%s/virgo-tomcat-server-%s.zip&r=1"%(virgo_version, virgo_version),
"https://github.com/Openworm/org.geppetto.core/archive/%s.zip"%branch,
"https://github.com/NeuroML/org.neuroml.model.injectingplugin/archive/%s.zip"%branch,
"https://github.com/NeuroML/org.neuroml.model/archive/%s.zip"%branch,
"https://github.com/NeuroML/org.neuroml.visualiser/archive/%s.zip"%branch,
]


tempdir = tempfile.mkdtemp()

#download and unpack all packages into a temp directory
for u in urls:
    print "Downloading: %s and unzipping into %s..."%(u,tempdir)
    (zFile, x) = urllib.urlretrieve(u)
    vz = zipfile.ZipFile(zFile)
    vz.extractall(tempdir)
    os.remove(zFile)
    
#make an osbexplorer directory and move the contents of virgo into it
#so the final package has a nice name
with lcd(tempdir):
    print local('mkdir -p package/osb-explorer', capture=True)
    print local("mv virgo-tomcat-server-%s/* package/osb-explorer/"%(virgo_version), capture=True)
    print local("rm -rf virgo-tomcat-server-%s "%(virgo_version), capture=True)

#set server home in temp directory
server_home = op.join(tempdir, 'package/osb-explorer')
os.environ['SERVER_HOME'] = server_home

#use Maven to build all the osbexplorer code bundles 
#and place the contents in the Virgo installation
osbpackages = ['org.geppetto.core', 'org.neuroml.model.injectingplugin',
               'org.neuroml.model', 'org.neuroml.visualiser']
for p in osbpackages:
    with lcd(tempdir):
        print local('mv %s-%s %s'%(p, branch, p), capture=True)
    dirp = op.join(tempdir, p)
    print '**************************'
    print 'BUILDING ' + dirp
    print '**************************'
    with lcd(dirp):
        with settings(hide('everything'), warn_only=True):
            print local('mvn install', capture=True)
            print local('cp target/classes/lib/* $SERVER_HOME/repository/usr/', capture=True)
            print local('cp target/* $SERVER_HOME/repository/usr/', capture=True)

#put the .plan file in the pickup folder      
with lcd(op.join(tempdir, 'org.neuroml.visualiser')):
    print local('cp osbexplorer.plan $SERVER_HOME/pickup/', capture=True)


#set permissions on the bin directory
#these do carry over into the archive
with lcd(server_home):
    print local('chmod -R +x ./bin', capture=True)
    
#zip up the contents of the virgo directory for distribution
archive_name = os.path.expanduser(os.path.join('~', 'osbexplorer-snapshot'))
root_dir = os.path.expanduser(os.path.join(tempdir, 'package'))
snapshot = shutil.make_archive(archive_name, 'zip', root_dir)

#delete the temp directory

print 'Your snapshot is ready: ' + snapshot
