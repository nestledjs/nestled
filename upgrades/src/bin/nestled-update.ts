#!/usr/bin/env node
import { run } from '../lib/cli';

process.exit(run(process.argv.slice(2)));
