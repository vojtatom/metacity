import sys

class bcolors:
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m' 
    BOLD = '\033[1m'


def printImport(text):
    sys.stdout.write(bcolors.OKBLUE +  bcolors.BOLD + str(text) + bcolors.ENDC + "\n")

def printOK(text):
    sys.stdout.write(bcolors.OKGREEN +  bcolors.BOLD + str(text) + bcolors.ENDC + "\n")
    sys.stdout.flush()

def printWarning(text):
    sys.stdout.write(bcolors.WARNING + bcolors.BOLD + str(text) + bcolors.ENDC + "\n")

def printFail(text):
    sys.stdout.write(bcolors.FAIL + bcolors.BOLD + str(text) + bcolors.ENDC + "\n")