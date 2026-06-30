class AuctionController:
    def __init__(self, starting_price=100):
        self.current_price = starting_price
        self.state = "START"  # START, BIDDING, RESULT
        self.message = "Welcome, Traveler. The Simulated Universe auction begins."

    def get_initial_sequence(self):
        return [
            "Welcome to the auction.",
            f"Starting price is {self.current_price}.",
            "Enter your bid when ready."
        ]

    def process_input(self, input_val):
        if self.state == "START":
            self.state = "BIDDING"
            self.message = f"Starting price is {self.current_price}. Enter your bid."
            return self.message

        if self.state == "BIDDING":
            try:
                bid = int(input_val)
                if bid > self.current_price:
                    self.current_price = bid
                    self.message = f"Bid of {bid} accepted. Higher bids incoming..."
                else:
                    self.message = "Bid too low. Try again."
            except ValueError:
                self.message = "Invalid input. Please enter a number."
            return self.message