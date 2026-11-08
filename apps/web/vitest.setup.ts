import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";
import { loadRequirements } from "./src/lib/degree/requirements";

beforeAll(async () => { await loadRequirements(); });

afterEach(cleanup);
