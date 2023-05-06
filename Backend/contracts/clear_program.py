from pyteal import *


def clear_program():
    return Int(1)


if __name__ == "__main__":
    print(compileTeal(clear_program(), Mode.Application, version=7))
