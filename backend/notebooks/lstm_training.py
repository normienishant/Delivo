import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import pickle

df = pd.read_csv("../data/train_clean.csv")
original_df = pd.read_csv("../data/train.csv")

# Date + hour combination se proper time series banao
original_df["Order_Date"] = pd.to_datetime(original_df["Order_Date"], format="%d-%m-%Y", errors="coerce")
original_df["Time_Orderd"] = pd.to_datetime(original_df["Time_Orderd"], format="%H:%M:%S", errors="coerce")
original_df["order_hour"] = original_df["Time_Orderd"].dt.hour
original_df["order_date"] = original_df["Order_Date"].dt.date

# Har date+hour pe kitne orders aaye
ts = original_df.groupby(["order_date", "order_hour"]).size().reset_index(name="order_count")
ts = ts.sort_values(["order_date", "order_hour"]).reset_index(drop=True)

print(f"Total time points: {len(ts)}")
print(ts.head(10))

order_counts = ts["order_count"].values.astype(float)

# Normalize
min_val = order_counts.min()
max_val = order_counts.max()
normalized = (order_counts - min_val) / (max_val - min_val)

# Sequences - 6 ghante dekh ke next predict karo
SEQ_LEN = 6

def make_sequences(data, seq_len):
    X, y = [], []
    for i in range(len(data) - seq_len):
        X.append(data[i:i+seq_len])
        y.append(data[i+seq_len])
    return np.array(X), np.array(y)

X, y = make_sequences(normalized, SEQ_LEN)
print(f"Sequences created: {len(X)}")

split = int(0.8 * len(X))
X_train, X_test = X[:split], X[split:]
y_train, y_test = y[:split], y[split:]

X_train = torch.FloatTensor(X_train).unsqueeze(-1)
X_test  = torch.FloatTensor(X_test).unsqueeze(-1)
y_train = torch.FloatTensor(y_train)
y_test  = torch.FloatTensor(y_test)

print(f"Train: {len(X_train)} | Test: {len(X_test)}")

class DeliveryLSTM(nn.Module):
    def __init__(self):
        super(DeliveryLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size=1, hidden_size=64, num_layers=2,
                            batch_first=True, dropout=0.2)
        self.fc = nn.Linear(64, 1)

    def forward(self, x):
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :]).squeeze()

model     = DeliveryLSTM()
loss_fn   = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

print("\nTraining LSTM...")
EPOCHS = 150
for epoch in range(EPOCHS):
    model.train()
    optimizer.zero_grad()
    pred = model(X_train)
    loss = loss_fn(pred, y_train)
    loss.backward()
    optimizer.step()

    if (epoch + 1) % 30 == 0:
        model.eval()
        with torch.no_grad():
            test_pred = model(X_test)
            test_loss = loss_fn(test_pred, y_test)
        print(f"Epoch {epoch+1}/150 | Train: {loss.item():.4f} | Test: {test_loss.item():.4f}")

# Results
model.eval()
with torch.no_grad():
    sample_pred = model(X_test[:8])

pred_real = sample_pred.numpy() * (max_val - min_val) + min_val
true_real = y_test[:8].numpy() * (max_val - min_val) + min_val

print("\nPredictions vs Actual:")
for i in range(8):
    diff = abs(pred_real[i] - true_real[i])
    print(f"  Predicted: {pred_real[i]:.0f} | Actual: {true_real[i]:.0f} | Diff: {diff:.0f}")

# Save
torch.save(model.state_dict(), "../models/lstm_model.pt")
with open("../models/lstm_meta.pkl", "wb") as f:
    pickle.dump({"min_val": min_val, "max_val": max_val, "seq_len": SEQ_LEN}, f)

print("\nLSTM saved.")
print("Next: FastAPI")