import { PREFIX } from "../../config";

type Person = {
    name: string;
    isSeed: boolean;
};

type Team = Person[];

export const drawTeams: Command = {
    name: "Sortear times",
    description: "Sortear times a partir de uma lista",
    commands: ["drawteams"],
    usage: `${PREFIX}draw-teams`,
    handle: async ({ sendReply, fullMessage }) => {
        function shuffle<T>(array: T[]): T[] {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        const lines: string[] = fullMessage
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("-"))
            .map((line) => line.replace(/^-/, "").trim());

        if (!lines.length) {
            await sendReply("Nenhuma lista foi enviada");

            return;
        }

        const people: Person[] = lines.map((name) => ({
            name,
            isSeed: name.includes("👑"),
        }));

        const seeds = shuffle(people.filter((p) => p.isSeed));
        const nonSeeds = shuffle(people.filter((p) => !p.isSeed));

        const totalPeople = people.length;
        const maxPerTeam = 6;
        const totalTeams = Math.ceil(totalPeople / maxPerTeam);

        const teams: Team[] = Array.from({ length: totalTeams }, () => []);

        seeds.forEach((seed, index) => {
            const teamIndex = index % totalTeams;
            teams[teamIndex].push(seed);
        });

        let currentTeam = 0;
        for (const person of nonSeeds) {
            while (teams[currentTeam].length >= maxPerTeam) {
                currentTeam = (currentTeam + 1) % totalTeams;
            }

            teams[currentTeam].push(person);
        }

        let result = "";

        teams.forEach((time, i) => {
            result += `\n*Time ${i + 1}:*\n${time
                .map((player) => `-${player.name}`)
                .join("\n")}\n`;
        });

        await sendReply(result);
    },
};
