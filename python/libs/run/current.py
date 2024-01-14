# import typing
# from df_prep import Processor

# from run.processors import *


# def get_all_subclasses(cls):
#     subclasses = cls.__subclasses__()
#     all_subclasses = subclasses
#     for subclass in subclasses:
#         all_subclasses += get_all_subclasses(subclass)
#     return all_subclasses

# all_subclasses = get_all_subclasses(Processor)

# for sub_class in all_subclasses:
#     print(sub_class)
#     actual_t = typing.get_args(sub_class)[0]  # Get the actual T type argument
#     print(actual_t)  # Output: <class 'int'>
# # print(all_subclasses)  # Prints all subclasses, including indirect ones



from typing import TypeVar, Generic
import typing

T = TypeVar('T')

class BaseClass(Generic[T]):
    pass

class Subclass(BaseClass[int]):  # Specifying T as int
    pass

actual_t = typing.get_args(Subclass()) # Get the actual T type argument
print(actual_t)  # Output: <class 'int'>