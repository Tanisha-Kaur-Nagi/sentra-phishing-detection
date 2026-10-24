import java.util.util.*;

class Staff {
    String name;
    String birthDate;
    String designation;
    double salary;

    Staff(String name, String birthDate, String designation, double salary) {
        this.name = name;
        this.birthDate = birthDate;
        this.designation = designation;
        this.salary = salary;
    }

    // Method to display details
    void display() {
        System.out.println("Name: " + name);
        System.out.println("Birth Date: " + birthDate);
        System.out.println("Designation: " + designation);
        System.out.println("Salary: " + salary);
        System.out.println("------------------------");
    }
}

public class Main {
    public static void main(String[] args) {

        // Creating two objects of Staff
        Staff s1 = new Staff("Amit", "12-05-1990", "Manager", 55000);
        Staff s2 = new Staff("Priya", "23-11-1988", "Clerk", 48000);

        // Display both staff details
        s1.display();
        s2.display();

        // Find and print staff with highest salary
        if (s1.salary > s2.salary) {
            System.out.println("Highest Salary: " + s1.name);
        } else {
            System.out.println("Highest Salary: " + s2.name);
        }
    }
}