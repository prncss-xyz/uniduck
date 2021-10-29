# Uniduck

A tiny web scraper and indexer for my personal documentation needs.

Crawls (inward only) starting from preset adresses. Scripts are removed, assets are downloaded and links are modified to connect locally downloaded text. A tab seperated index of targets is then established. I can then access documentation with the following script:
 
```bash
#!/usr/bin/env sh

cd "$WEBDIR"|| exit 1

res="$(fd -e csv -x cat|fzf --delimiter='\t' --nth=1,2 --with-nth=1|cut  -f2)"
if [ -n "$res" ]; then
  browser "$res" 2> /dev/null
fi

```

Environment variable $WEBDIR determines where files are downloaded.

As it is mostly targeted for my personal use, configuration is done in source. It should still be easy to modify.
