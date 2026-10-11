import { Command } from "commander";
import { readFileSync } from "node:fs";

const program = new Command();

const fileText = readFileSync("data.json", "utf8");
const data = JSON.parse(fileText);

program
  .name("tournament-cli")
  .description("Програма для роботи з футбольним турніром")
  .version("1.0.0");

const listCommand = program
  .command("list")
  .description("Показати список матчів")
  .option("-l, --limit <number>", "Обмежити кількість матчів");

listCommand.action(() => {
  const options = listCommand.opts();

  const limit =
    options.limit === undefined
      ? data.matches.length
      : Number(options.limit);

  const matchesToShow = data.matches.slice(0, limit);

  for (const match of matchesToShow) {
    console.log(
      `${match.date}: ${match.team1} ${match.score.team1}:${match.score.team2} ${match.team2}`
    );
  }
});

program.parse();