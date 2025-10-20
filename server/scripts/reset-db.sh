#!/bin/bash

set -euo pipefail

sea-orm-cli migrate refresh
