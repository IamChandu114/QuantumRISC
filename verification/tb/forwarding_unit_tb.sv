`timescale 1ns / 1ps

module forwarding_unit_tb;

logic RegWrite_MEM;
logic RegWrite_WB;

logic [4:0] rd_MEM;
logic [4:0] rd_WB;

logic [4:0] rs1_EX;
logic [4:0] rs2_EX;

logic [1:0] ForwardA;
logic [1:0] ForwardB;

forwarding_unit dut(.*);

initial begin

    $display("--------------------------------");
    $display("Forwarding Unit Test");
    $display("--------------------------------");

    // Forward from MEM
    RegWrite_MEM = 1;
    RegWrite_WB  = 0;

    rd_MEM = 5'd5;
    rd_WB  = 5'd0;

    rs1_EX = 5'd5;
    rs2_EX = 5'd2;

    #10;

    if(ForwardA == 2'b10)
        $display("[PASS] MEM Forward A");

    // Forward from WB
    RegWrite_MEM = 0;
    RegWrite_WB  = 1;

    rd_MEM = 5'd0;
    rd_WB  = 5'd8;

    rs1_EX = 5'd3;
    rs2_EX = 5'd8;

    #10;

    if(ForwardB == 2'b01)
        $display("[PASS] WB Forward B");

    // No forwarding
    RegWrite_MEM = 0;
    RegWrite_WB  = 0;

    #10;

    if(ForwardA == 2'b00 && ForwardB == 2'b00)
        $display("[PASS] No Forwarding");

    $display("--------------------------------");

    $finish;

end

endmodule