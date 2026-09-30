// Load saved API key on startup if available
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
  });
});

document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  const btn = document.getElementById('analyzeBtn');

  if (!apiKey) {
    statusDiv.innerText = "Please enter an API key first!";
    return;
  }

  // Save API key for future sessions
  chrome.storage.local.set({ geminiApiKey: apiKey });

  btn.disabled = true;
  statusDiv.innerText = "Extracting text from page...";
  resultDiv.style.display = "none";

  try {
    // Firefox sidebar compatibility: use lastFocusedWindow instead of currentWindow
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    if (!tab) {
      throw new Error("Could not detect an active tab.");
    }

    // Execute content script asynchronously
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const paragraphs = Array.from(document.querySelectorAll('p'));
        return paragraphs.map(p => p.innerText).join('\n');
      }
    });

    const articleText = results && results[0] ? results[0].result : null;

    if (!articleText || articleText.trim().length < 100) {
      statusDiv.innerText = "Could not find sufficient article text on this page.";
      btn.disabled = false;
      return;
    }

    statusDiv.innerText = "Agent is analyzing the article...";

    // Send data to local FastAPI backend
    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: articleText, api_key: apiKey })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "API error");
    }

    const data = await response.json();

    // Update UI elements
    document.getElementById('scoreValue').innerText = data.objectivity_score + " / 100";
    document.getElementById('summaryText').innerText = data.summary;
    
    // Render Key Claims with Explanation
    const claimsContainer = document.getElementById('claimsList');
    claimsContainer.innerHTML = '';
    
    if (data.key_claims && data.key_claims.length > 0) {
      data.key_claims.forEach(c => {
        const div = document.createElement('div');
        div.className = 'claim-box';
        
        // Dynamische kleur-styling op basis van het verdict
        let verdictColor = '#2563eb'; // Blauw standaard
        const vLower = c.verdict.toLowerCase();
        if (vLower.includes('onjuist') || vLower.includes('false')) {
          verdictColor = '#dc2626'; // Rood
        } else if (vLower.includes('juist') || vLower.includes('true') || vLower.includes('onderbouwd')) {
          verdictColor = '#16a34a'; // Groen
        }

        div.style.borderLeft = `3px solid ${verdictColor}`;

        div.innerHTML = `
          <div style="font-weight: 600; color: #1f2937;">${c.claim}</div>
          <div style="margin-top: 4px; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #e5e7eb; color: ${verdictColor};">
              ${c.verdict}
            </span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.4;">
            ${c.explanation}
          </p>
        `;
        claimsContainer.appendChild(div);
      });
    }

    // Render Perspectives (indien gewenst)
    let perspectivesContainer = document.getElementById('perspectivesList');
    if (!perspectivesContainer) {
      perspectivesContainer = document.createElement('div');
      perspectivesContainer.id = 'perspectivesList';
      resultDiv.appendChild(perspectivesContainer);
    }
    perspectivesContainer.innerHTML = '';

    if (data.perspectives && data.perspectives.length > 0) {
      const header = document.createElement('h3');
      header.innerText = 'Perspectives';
      header.style.cssText = 'margin: 12px 0 6px 0; font-size: 13px; text-transform: uppercase; color: #4b5563; letter-spacing: 0.5px;';
      perspectivesContainer.appendChild(header);

      data.perspectives.forEach(p => {
        const pDiv = document.createElement('div');
        pDiv.className = 'claim-box';
        pDiv.style.borderLeft = '3px solid #8b5cf6'; // Paars voor perspectieven
        pDiv.innerHTML = `
          <strong style="color: #6b21a8;">${p.stakeholder}:</strong>
          <span style="font-size: 12px; color: #374151;">${p.viewpoint}</span>
        `;
        perspectivesContainer.appendChild(pDiv);
      });
    }

    statusDiv.innerText = "Analysis completed!";
    resultDiv.style.display = "block";

  } catch (err) {
    statusDiv.innerText = "Error: " + err.message;
  } finally {
    btn.disabled = false;
  }
});