#!/bin/env bash
[[ $# -ne 1 ]] && echo  "Usage: yarn prepare <network_config>" && exit 1
mustache config/$1.json subgraph.template.yaml > subgraph1.yaml