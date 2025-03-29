from pulp import *

# Create the LP problem
prob = LpProblem("Game_Theory_1a", LpMinimize)

# Define variables
P = LpVariable("P")
p1 = LpVariable(name="p1", lowBound=0)
p2 = LpVariable(name="p2", lowBound=0)
p3 = LpVariable(name="p3", lowBound=0)
p4 = LpVariable(name="p4", lowBound=0)

# Objective function
prob += P

# Constraints
prob += P >= 3*p1 + p2 + p3 + p4
prob += P >= 1.5*p1 + 2*p2 + p3 + p4
prob += P >= p1 + 1.33333333*p2 + 1.666666666*p3 + p4
prob += P >= p1 + 1.33333333*p2 + 1.666666666*p3 + 2*p4
prob += p1 + p2 + p3 + p4 == 1

# Solve the problem
prob.solve()

# Print the results
print("Status:", LpStatus[prob.status])
print("Optimal P =", value(P))
print("p1 =", value(p1))
print("p2 =", value(p2))
print("p3 =", value(p3))
print("p4 =", value(p4))