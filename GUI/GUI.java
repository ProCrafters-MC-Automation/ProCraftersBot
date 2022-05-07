import java.util.concurrent.*;
import javax.swing.*;
import java.lang.*;
import java.io.*;

public class GUI {
	public static void main(String[] args) {
		System.out.println("GUI Launched");
		new BasicSettings();
	}

	static String IP;
	static String VersionSt;

	//Basic Settings
	public static class BasicSettings extends JFrame {
		public JButton Submit;
		public JTextField Address;
		public JTextField Port;
		public JTextField Version;

		public BasicSettings() {
			getContentPane().setLayout(null);
			setupGUI();
			setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		}

		void setupGUI() {
			Submit = new JButton();
			Submit.setLocation(200, 400);
			Submit.setSize(100, 50);
			Submit.setText("Submit");
			getContentPane().add(Submit);

			Address = new JTextField();
			Address.setLocation(200, 50);
			Address.setSize(100, 50);
			Address.setText("Server Address");
			Address.setColumns(10);
			getContentPane().add(Address);

			Port = new JTextField();
			Port.setLocation(200, 150);
			Port.setSize(100, 50);
			Port.setText("Server Port");
			Port.setColumns(10);
			getContentPane().add(Port);

			Version = new JTextField();
			Version.setLocation(200, 250);
			Version.setSize(100, 50);
			Version.setText("Server Version");
			Version.setColumns(10);
			getContentPane().add(Version);

			setTitle("Basic Setting");
			setSize(500, 500);
			setVisible(true);
			setResizable(true);

			Submit.addActionListener(ae -> {
				String AddressSt = Address.getText();
				String PortSt = Port.getText();
				VersionSt = Version.getText();
				IP = AddressSt + " " + PortSt;
				System.out.println("IP: " + IP + ", Version: " + VersionSt);

				setVisible(false);
				new Launcher();

			});
		}
	}

	//Launcher Page
	public static class Launcher extends JFrame {
		JLabel BodyguardLabel;
        JButton BodyguardStart;
		JTextField Prefix;
        JTextField Boss;
        JTextField BotCount;

		JLabel ResourceLabel;
        JButton ResourceStart;
        JTextField Password;
		JTextField BossName;

		JLabel UltimateLabel;
		JButton UltimateStart;        
		JTextField UltimateName;

		public Launcher() {
			getContentPane().setLayout(null);
			setupGUI();
			setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		}

		void setupGUI() {
			BodyguardLabel = new JLabel();
			BodyguardLabel.setLocation(50, 10);
			BodyguardLabel.setSize(100, 50);
			BodyguardLabel.setText("Bodyguard's - ");
			getContentPane().add(BodyguardLabel);

			ResourceLabel = new JLabel();
			ResourceLabel.setLocation(200, 10);
			ResourceLabel.setSize(100, 50);
			ResourceLabel.setText("Resource's -");
			getContentPane().add(ResourceLabel);

			UltimateLabel = new JLabel();
			UltimateLabel.setLocation(350, 10);
			UltimateLabel.setSize(100, 50);
			UltimateLabel.setText("Ultimate's -");
			getContentPane().add(UltimateLabel);

			Prefix = new JTextField();
			Prefix.setLocation(50, 100);
			Prefix.setSize(100, 50);
			Prefix.setText("Prefix");
			Prefix.setColumns(10);
			getContentPane().add(Prefix);

			Boss = new JTextField();
			Boss.setLocation(50, 200);
			Boss.setSize(100, 50);
			Boss.setText("Boss Name");
			Boss.setColumns(10);
			getContentPane().add(Boss);

            BotCount = new JTextField();
			BotCount.setLocation(50, 300);
			BotCount.setSize(100, 50);
			BotCount.setText("Bot Count");
			BotCount.setColumns(10);
			getContentPane().add(BotCount);

			Password = new JTextField();
			Password.setLocation(200, 100);
			Password.setSize(100, 50);
			Password.setText("Password");
			Password.setColumns(10);
			getContentPane().add(Password);

			BossName = new JTextField();
			BossName.setLocation(200, 200);
			BossName.setSize(100, 50);
			BossName.setText("Boss Name");
			BossName.setColumns(10);
			getContentPane().add(BossName);

			UltimateName = new JTextField();
			UltimateName.setLocation(350, 100);
			UltimateName.setSize(100, 50);
			UltimateName.setText("Name");
			UltimateName.setColumns(10);
			getContentPane().add(UltimateName);

			BodyguardStart = new JButton();
			BodyguardStart.setLocation(50, 400);
			BodyguardStart.setSize(100, 50);
			BodyguardStart.setText("Start");
			getContentPane().add(BodyguardStart);

			ResourceStart = new JButton();
			ResourceStart.setLocation(200, 300);
			ResourceStart.setSize(100, 50);
			ResourceStart.setText("Start");
			getContentPane().add(ResourceStart);

			UltimateStart = new JButton();
			UltimateStart.setLocation(350, 200);
			UltimateStart.setSize(100, 50);
			UltimateStart.setText("Start");
			getContentPane().add(UltimateStart);

			BodyguardStart.addActionListener(ae -> {

				String PrefixSt = Prefix.getText();
				String BossSt = Boss.getText();
				String BotCountSt = BotCount.getText();

				String BodyguardDir = "C:/Users/pruth/Documents/GitHub/ProCrafters-Bot/BodyguardBots";
				String bodyguardCommand = "node bodyguards.js " + PrefixSt + " " + BossSt + " " + IP + " " + BotCountSt + " " + VersionSt;
				System.out.println(bodyguardCommand);

				Executors.newSingleThreadExecutor().execute(() -> BotRunner(BodyguardDir, bodyguardCommand));
			});

			ResourceStart.addActionListener(ae -> {
				String PasswordSt = Password.getText();
				String BossNameSt = BossName.getText();

String ResourceDir = "C:/Users/pruth/Documents/GitHub/ProCrafters-Bot/ResourceBots";
				String resourceCommand = "node index.js " + IP + " " + PasswordSt + " " + BossNameSt + " " + VersionSt;
				System.out.println(resourceCommand);

Executors.newSingleThreadExecutor().execute(() -> BotRunner(ResourceDir, resourceCommand));
			});

			UltimateStart.addActionListener(ae -> {
				String NameSt = UltimateName.getText();

String UltimateDir = "C:/Users/pruth/Documents/GitHub/ProCrafters-Bot/UltimateBot";
				String ultimateCommand = "node main.js " + NameSt + " " + IP + " " + VersionSt;
				System.out.println(ultimateCommand);

Executors.newSingleThreadExecutor().execute(() -> BotRunner(UltimateDir, ultimateCommand));
			});

			setTitle("Launcher");
			setSize(500, 500);
			setVisible(true);
			setResizable(true);


		}

        public static void BotRunner(String dir, String command) {
            try {
                Process process = Runtime.getRuntime().exec(command, null, new File(dir));
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
					System.out.println("An error has occurred!");
					System.out.println(output);
					System.exit(1);
                }

            } catch (IOException | InterruptedException e) {
                e.printStackTrace();
            }
		}
	}
}