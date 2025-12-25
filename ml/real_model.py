import torch
import torch.nn as nn
import asyncio

class ConfidenceModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(10, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    async def infer(self):
        await asyncio.sleep(0.2)
        x = torch.randn(1, 10)
        with torch.no_grad():
            y = self.net(x).item()
        return round(50 + y * 50, 2)

model = ConfidenceModel()

async def get_real_confidence():
    return await model.infer()
