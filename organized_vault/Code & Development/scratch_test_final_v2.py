import os
import sys

def scrape_metrics():
    print('Collecting system latency metrics...')
    return {'latency_ms': 4.2, 'cpu_load': 18}

if __name__ == '__main__':
    print(scrape_metrics())
