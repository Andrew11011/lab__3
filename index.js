import { Command } from "commander";
import { readFileSync } from "node:fs";

// Створення CLI-інтерфейсу
const program = new Command();

// Налаштування основної команди програми
program
  .name("tournament-cli")
  .description("Програма для роботи з футбольним турніром")
  .version("1.0.0")
  .option("-f, --file <path>", "Шлях до JSON-файлу", "data.json");
  

// Команда для показу списку матчів
const listCommand = program
  .command("list")
  .description("Показати список матчів")
  .option("-l, --limit <number>", "Обмежити кількість матчів");

// Зчитування даних із JSON-файлу
function getData() {
  const file = program.opts().file;
  
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
    } catch {
        console.error("Помилка: не вдалося прочитати файл даних");
        process.exit(1);
    }
}

// Вивід матчів з можливістю обмеження кількості
listCommand.action(() => {
  const data = getData();
  const options = listCommand.opts();

  const limit =
    options.limit === undefined
      ? data.matches.length
      : Number(options.limit);

    if (!Number.isInteger(limit) || limit < 1) {
        console.error("Помилка: ліміт має бути додатним цілим числом");
        process.exitCode = 1;
        return;
}

  const matchesToShow = data.matches.slice(0, limit);

  for (const match of matchesToShow) {
    console.log(
      `${match.date}: ${match.team1} ${match.score.team1}:${match.score.team2} ${match.team2}`
    );
  }
});

// Команда для перегляду одного матчу за номером
program
  .command("match <number>")
  .description("Показати один матч повністю")
  .action((number) => {
    const data = getData();
    const index = Number(number) - 1;
    const match = data.matches[index];

    if (!match) {
      console.error("Помилка: такого матчу немає");
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify(match, null, 2));
  });

// Команда для читання окремого поля з даних матчу
program
  .command("play <number> <path>")
  .description("Показати окреме поле матчу")
  .action((number, path) => {
    try {
      const data = getData();
      let value = data.matches[Number(number) - 1];

      for (const part of path.split(".")) {
        value = value[part];
      }

      if (value === undefined) {
        throw new Error();
      }

      console.log(
        typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : value
      );
    } catch {
      console.error("Помилка: матч або поле не знайдено");
      process.exitCode = 1;
    }
  });

// Команда для відображення складу команди
program
  .command("team <name>")
  .description("Показати склад команди")
  .action((name) => {
    const data = getData();
    const team = data.teams.find(
      (team) => team.name.toLowerCase() === name.toLowerCase()
    );

    if (!team) {
      console.error("Помилка: такої команди немає");
      process.exitCode = 1;
      return;
    }

    console.log(team.name);

    for (const player of team.players) {
      console.log(`- ${player}`);
    }
  });

// Команда для пошуку матчів за командою або датою
const matchesCommand = program
  .command("matches")
  .description("Знайти матчі")
  .option("-t, --team <name>", "Назва команди")
  .option("-d, --date <date>", "Дата матчу");

// Фільтрація матчів за параметрами користувача
matchesCommand.action(() => {
  const data = getData();
  const options = matchesCommand.opts();

  const matches = data.matches.filter((match) =>
    (!options.team ||
      match.team1 === options.team ||
      match.team2 === options.team) &&
    (!options.date || match.date === options.date)
  );

  if (matches.length === 0) {
    console.error("Матчів не знайдено");
    return;
  }

  for (const match of matches) {
    console.log(
      `${match.date}: ${match.team1} ${match.score.team1}:${match.score.team2} ${match.team2}`
    );
  }
});

// Команда для підрахунку бомбардирів
const scorersCommand = program
  .command("scorers")
  .description("Показати список бомбардирів")
  .option("-p, --penalties", "Показати лише голи з пенальті");

// Підрахунок голів для кожного гравця
scorersCommand.action(() => {
  const options = scorersCommand.opts();
  const data = getData();
  const goals = {};

  for (const match of data.matches) {
    for (const event of match.events) {
      const isGoal = event.type === "goal";
      const isNeeded = !options.penalties || event.penalty === true;

      if (isGoal && isNeeded) {
        if (!goals[event.player]) {
          goals[event.player] = 0;
        }

        goals[event.player]++;
      }
    }
  }

  const scorers = Object.entries(goals);
  scorers.sort((a, b) => b[1] - a[1]);

  for (const [player, goalCount] of scorers) {
    console.log(`${player}: ${goalCount}`);
  }
});

// Запуск CLI
program.parse();