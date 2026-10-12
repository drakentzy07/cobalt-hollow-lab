import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from infer_armor import validate_decisions,OPTIONS,normalize_choice
baseline=dict(theme='eclipse',helmet='sealed',shoulders='crescent',chest='gem',back='crystals',shape='angular',metal='obsidian',accent='violet')
dragon=dict(theme='dragon',helmet='horned',shoulders='scaled',chest='runes',back='spine',shape='segmented',metal='bronze',accent='red')
assert validate_decisions(baseline,'Eclipse Eterno con armadura negra violeta')==baseline
assert validate_decisions(dragon,'Dragon rojo con cuernos y escamas de bronce')==dragon
assert baseline!=dragon
try:validate_decisions({**dragon,'chest':'impossible'},'dragon rojo con cuernos')
except ValueError as e:assert 'UNKNOWN_MODEL_DECISION' in str(e)
else:raise AssertionError('MUST_REJECT_INVALID_AI')
try:validate_decisions({**dragon,'back':None},'dragon rojo con cuernos')
except ValueError:pass
else:raise AssertionError('MUST_REJECT_NULL_AI')
print('HIGHFLY_SKIN15_STRICT_MODEL_CATEGORICAL_SCHEMA_QA_GREEN=1')
