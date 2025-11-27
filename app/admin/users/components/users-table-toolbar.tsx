"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useAtom } from "jotai";
import { usersSearchAtom, usersRoleFilterAtom } from "../state";

export function UsersTableToolbar() {
  const [search, setSearch] = useAtom(usersSearchAtom);
  const [roleFilter, setRoleFilter] = useAtom(usersRoleFilterAtom);

  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Role filter */}
      <Select
        value={roleFilter || "all"}
        onValueChange={(value) => setRoleFilter(value === "all" ? undefined : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
