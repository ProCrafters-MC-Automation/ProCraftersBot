import java.awt.*;
import javax.swing.*;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.Executors;

public class GUI {
    public static void main(String[] args) {
        System.out.println("GUI Launched");
        new Login();
    }

    // Login Page
    public static class Login extends JFrame {
        JTextField username;
        JTextField password;
        JButton login;

        public Login() {
            getContentPane().setLayout(null);
            setupGUI();
            setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        }

        void setupGUI() {
            username = new JTextField();
            username.setLocation(150, 50);
            username.setSize(100, 50);
            username.setText("username");
            username.setColumns(10);
            getContentPane().add(username);

            password = new JPasswordField();
            password.setLocation(150, 150);
            password.setSize(100, 50);
            password.setText("password");
            password.setColumns(10);
            getContentPane().add(password);

            login = new JButton();
            login.setLocation(150, 250);
            login.setSize(100, 50);
            login.setBackground(new Color(-1));
            login.setText("Login");
            getContentPane().add(login);

            setTitle("Login");
            setSize(400, 400);
            setBackground(new Color(-16711681));
            setVisible(true);
            setResizable(true);

            login.addActionListener(ae -> {
                if (username.getText().equals("admin") && password.getText().equals("admin")) {
                    setVisible(false);
                    new BotLauncher();
                    System.out.println("Launched");
                }
            });
        }
    }

    // Launcher Page
    public static class BotLauncher extends JFrame {
        JLabel addressLabel;
        JTextField address;
        JLabel portLabel;
        JTextField port;
        JLabel passwordLabel;
        JLabel BossLabel;
        JTextField password;
        JTextField boss;
        JButton start;

        public BotLauncher() {
            getContentPane().setLayout(null);
            setupGUI();
            setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        }

        void setupGUI() {
            addressLabel = new JLabel();
            addressLabel.setLocation(10, 10);
            addressLabel.setSize(100, 50);
            addressLabel.setText("Server Address");
            getContentPane().add(addressLabel);

            address = new JTextField();
            address.setLocation(10, 70);
            address.setSize(100, 50);
            address.setText("localhost");
            address.setColumns(10);
            getContentPane().add(address);

            portLabel = new JLabel();
            portLabel.setLocation(120, 10);
            portLabel.setSize(100, 50);
            portLabel.setText("Server Port");
            getContentPane().add(portLabel);

            port = new JTextField();
            port.setLocation(120, 70);
            port.setSize(100, 50);
            port.setText("25565");
            port.setColumns(10);
            getContentPane().add(port);

            passwordLabel = new JLabel();
            passwordLabel.setLocation(230, 10);
            passwordLabel.setSize(100, 50);
            passwordLabel.setText("Password");
            getContentPane().add(passwordLabel);

            BossLabel = new JLabel();
            BossLabel.setLocation(340, 10);
            BossLabel.setSize(100, 50);
            BossLabel.setText("Boss");
            getContentPane().add(BossLabel);

            password = new JTextField();
            password.setLocation(230, 70);
            password.setSize(100, 50);
            password.setText("Password");
            password.setColumns(10);
            getContentPane().add(password);

            boss = new JTextField();
            boss.setLocation(340, 70);
            boss.setSize(100, 50);
            boss.setText("Boss");
            boss.setColumns(10);
            getContentPane().add(boss);

            start = new JButton();
            start.setLocation(175, 130);
            start.setSize(100, 50);
            start.setText("Start Bot");
            getContentPane().add(start);

            setTitle("Bot Launcher");
            setSize(500, 500);
            setForeground(new Color(-1));
            setBackground(new Color(-16711681));
            setVisible(true);
            setResizable(false);

            start.addActionListener(ae -> {
                String command = "node index.js " + address.getText() + " " + port.getText() + " " + password.getText()
                        + " " + boss.getText();
                System.out.println(command);

                Executors.newSingleThreadExecutor().execute(() -> BotRunner(command));
            });
        }

        public static void BotRunner(String command) {
            try {
                Process process = Runtime.getRuntime().exec(command, null, new File(System.getProperty("user.dir")));
                StringBuilder output = new StringBuilder();

                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }

                int exitVal = process.waitFor();
                if (exitVal == 0) {
                    System.out.println("Success!");
                    System.out.println(output);
                    System.exit(0);
                } else {
                    System.out.println("An error has occurred - " + "Error " + exitVal);
                    System.out.println(output);
                    System.exit(1);
                }

            } catch (IOException | InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}