import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { groups } from "@/lib/world-cup-data";

export default function PointTablePage() {
  return (
    <main className="flex-1 px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header>
          <p className="text-sm font-medium text-muted-foreground">
            FIFA World Cup 2026
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Group Stage
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            48 teams compete across 12 groups. The top two teams from each
            group, plus the 8 best third-placed teams, advance to the Round
            of 32.
          </p>
        </header>

        <Link
          href="/tree"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View knockout stage bracket →
        </Link>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((group) => (
            <Card key={group.name} className="gap-2 px-3">
              <span className="text-xs font-semibold text-muted-foreground">
                Group {group.name}
              </span>
              <ul className="flex flex-col gap-1.5">
                {group.teams.map((team, i) => (
                  <li
                    key={team.name}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">
                        {team.flag}
                      </span>
                      <span
                        className={
                          i < 2 ? "font-medium" : "text-muted-foreground"
                        }
                      >
                        {team.name}
                      </span>
                    </span>
                    {i < 2 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {i + 1}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
