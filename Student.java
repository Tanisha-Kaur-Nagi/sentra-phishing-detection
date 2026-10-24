import java.util.util.*;
class Student {
    int rollno;
    String name;

    Student(int rollno, String name) {
        this.rollno = rollno;
        this.name = name;
    }
}

class Marks extends Student {
    int javaTheory;
    int javaPractical;
    int total;

    Marks(int rollno, String name, int javaTheory, int javaPractical) {
        super(rollno, name);
        this.javaTheory = javaTheory;
        this.javaPractical = javaPractical;
    }

    // Method to set marks and calculate total
    void setMark() {
        total = javaTheory + javaPractical;
    }
}

public class FinalMarks {
    public static void main(String[] args) {
        Marks m1 = new Marks(101, "Rahul", 40, 35);

        m1.setMark(); // sets total marks

        System.out.println("Roll No: " + m1.rollno);
        System.out.println("Name: " + m1.name);
        System.out.println("Java Theory: " + m1.javaTheory);
        System.out.println("Java Practical: " + m1.javaPractical);
        System.out.println("Total Java Marks: " + m1.total);
    }
}