import java.util.util.*;
class Employee {
    int empNo;
    String empName;
    String designation;

    Employee(int empNo, String empName, String designation) {
        this.empNo = empNo;
        this.empName = empName;
        this.designation = designation;
    }
}

class Salary extends Employee {
    double basicSal;

    Salary(int empNo, String empName, String designation) {
        super(empNo, empName, designation);
    }

    // Method to calculate salary based on designation
    void calculateSalary() {
        if (designation.equalsIgnoreCase("Manager")) {
            basicSal = 50000;
        } else if (designation.equalsIgnoreCase("Clerk")) {
            basicSal = 25000;
        } else if (designation.equalsIgnoreCase("Officer")) {
            basicSal = 35000;
        } else {
            basicSal = 15000; // default salary
        }
    }

    void display() {
        System.out.println("Emp No: " + empNo);
        System.out.println("Emp Name: " + empName);
        System.out.println("Designation: " + designation);
        System.out.println("Basic Salary: " + basicSal);
    }
}

public class Main {
    public static void main(String[] args) {
        Salary s1 = new Salary(1, "Suresh", "Manager");
        s1.calculateSalary();
        s1.display();

        System.out.println("------------------------");

        Salary s2 = new Salary(2, "Anita", "Clerk");
        s2.calculateSalary();
        s2.display();
    }
}