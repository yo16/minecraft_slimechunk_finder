import java.util.Random;

public class TestJavaRandom {
    public static void main(String[] args) {
        long seed = 1234567890123456789L;
        Random rnd = new Random(seed);

        for (int i = 0; i < 10; i++) {
            System.out.println(rnd.nextInt());
        }
    }
}
