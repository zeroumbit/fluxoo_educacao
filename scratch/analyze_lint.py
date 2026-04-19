
import json
import collections

try:
    with open('lint-results.json', 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    rule_counts = collections.Counter()
    total_errors = 0
    
    for file_report in data:
        for message in file_report.get('messages', []):
            if message.get('severity') == 2: # Error
                rule_counts[message.get('ruleId')] += 1
                total_errors += 1
    
    print(f"Total Errors: {total_errors}")
    print("Top 10 Rules:")
    for rule, count in rule_counts.most_common(10):
        print(f"  {rule}: {count}")

except Exception as e:
    print(f"Error analyzing JSON: {e}")
