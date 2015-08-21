KPI
===

Searching assets and collections
--------------------------------
Top-level (null-parent) assets and collections can be found by including `parent=` in the query string. For other searches, construct a string using the [Whoosh query language](https://pythonhosted.org/Whoosh/querylang.html) and pass it in as the `q` parameter, e.g. `/assets/?q=name:sanitation`. Fields indexed by Whoosh are:

* `name`: a tokenized\* representation of the name;
* `name__exact`: a space- and comma-escaped representation of the name, e.g. "Fun, Exciting Asset" would be indexed as "Fun--Exciting-Asset";
* `owner__username`: a tokenized\* representation of the owner's username;
* `owner__username__exact`: a space- and comma-escaped representation of the owner's username;
* `parent__name`: a tokenized\* representation of the parent object's name;
* `parent__name__exact`: a space- and comma-escaped representation of the parent object's name;
* `parent__uid`: the UID of the parent collection;
* `ancestor__uid`: a multi-value field containing the UIDs of all ancestor collections;
* `tag`: a multi-valued field holding space- and comma-escaped representations of each tag assigned to the object;
* `asset_type` (for assets only): a space- and comma-escaped representation of the asset's type string.

\* Implemented by Haystack as [a Whoosh TEXT field using the StemmingAnalyzer](https://github.com/django-haystack/django-haystack/blob/ad90028a22b4274b8df1f4698dd59ac0643f03d5/haystack/backends/whoosh_backend.py#L174). Unsuitable for exact matching.

When the `q` parameter contains a search term without a specified field, e.g. `/collections/?q=health`, that term is matched against the search "document" (the `text` field), which is built by [text templates](https://github.com/kobotoolbox/kpi/tree/master/kpi/templates/search/indexes/kpi).