# RandNum

RandNum is a guess the number lottery game built on the algorand blockchain.The game’s rules are straightforward: if players accurately predict the winning number, they win a prize. Winners receive their awards in the form of Algo, the native cryptocurrency of the Algorand network.

# Project Structure

This project is made up of 2 main folders

- backend
- frontend

## Backend

The backend folder contains the contracts folder. This folder house the pyteal lotto.py contract and the abi json file. It also contains an express server part that interacts with the contract and offers api services. The article explaining the contract can be found [here](https://jaybee020.github.io/My-Blogs/posts/randnum-contract/) while the article explaining the server can be found [here](https://jaybee020.github.io/My-Blogs/posts/randnum-server/)

## Frontend

This is the official frontend of RandNum interacting with the express backend. It is written in React.Click [here](https://randnum.xyz) to play.

There is a youtube video [here]("https://www.youtube.com/watch?v=yxtMKwMOq-Y")
