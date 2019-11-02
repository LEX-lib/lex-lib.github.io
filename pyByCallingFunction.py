#python 2.7.15
import math

x = 26977

#New Class
class MathExec:
 def __init__(var1,num1):
  var1.num1 = math.sqrt(num1)
  var1.num2 = num1
  
 def showSqrt(var1):
  print("The squareroot of the number is: " + str(var1.num1))

 def isOddorEven(var1):
  if var1.num2%2 == 0:
   print(str(var1.num2) + " is Even.")
  else:
   print(str(var1.num2) +" is Odd.")

#New Functions
def extractSQR(num):
 return math.sqrt(num)

def OddOrEven(num):
 mod = num%2
 if mod==0:
  print(str(num) + " is Even")
 else:
  print(str(num) + "is Odd")

#Exec Main Body

 # Executing using Call Function
print("The squareroot of the number is: " + str(extractSQR(x)))
OddOrEven(x)

print("----------------------------------")

 # Executing using Instantation
z = MathExec(x)
z.showSqrt()
z.isOddorEven()