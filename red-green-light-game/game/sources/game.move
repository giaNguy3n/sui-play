module redgreen::game {
    use sui::tx_context::TxContext;
    use sui::object;
    use sui::transfer;

    public struct GameResult has key, store {
        id: object::UID,
        player: address,
        won: bool,
        moves_hash: vector<u8>,
    }

    public entry fun submit_game(
    player: address,
    won: bool,
    moves_hash: vector<u8>,
    ctx: &mut TxContext
    ) {
        let result = GameResult {
            id: object::new(ctx),
            player,
            won,
            moves_hash,
        };

        // 🔥 Store the result object by transferring it to the player
        transfer::public_transfer(result, player);
    }
}
