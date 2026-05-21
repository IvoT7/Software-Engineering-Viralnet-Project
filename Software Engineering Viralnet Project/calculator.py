def sumt(num1, num2):
    return num1 + num2

def subt(num1, num2):
    return num2 - num1

def mult(num1, num2):
    return num1 * num2

def div(num1, num2):
    return num2 / num1

print('Fixed calculator code with error handling\n')

while True:
    try:
        
        num1 = float(input('Enter first number: '))
        num2 = float(input('Enter second number: '))

        
        sum_res = sumt(num1, num2)
        sub_res = subt(num1, num2)
        mult_res = mult(num1, num2)
        div_res = div(num1, num2)

        print(f'\nResults:\nSum = {sum_res}\nSubtract = {sub_res}\nMultiply = {mult_res}\nDivision = {div_res}\n')
        
        
        break

    except ValueError:
        print("Error: Please enter a valid number, not text!\n")
    except ZeroDivisionError:
        print("Error: Cannot divide by zero. Please enter a non-zero first number.\n")
    except Exception as e:
        print(f"An unexpected error occurred: {e}\n")